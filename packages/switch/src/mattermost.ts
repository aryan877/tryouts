import { HttpError, request } from "./http";

export interface MattermostUser {
  id: string;
  username: string;
}

export interface Post {
  id: string;
  user_id: string;
  channel_id: string;
  message: string;
  type: string;
  create_at: number;
  update_at: number;
}

export class Mattermost {
  private constructor(
    readonly url: string,
    readonly token: string,
    readonly me: MattermostUser,
  ) {}

  static async login(url: string, username: string, password: string): Promise<Mattermost> {
    const response = await fetch(`${url}/api/v4/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login_id: username, password }),
    });
    if (!response.ok) {
      throw new HttpError(response.status, "POST", "/api/v4/users/login", await response.text());
    }
    const token = response.headers.get("token");
    if (!token) throw new Error(`Mattermost accepted ${username} but returned no token.`);
    return new Mattermost(url, token, (await response.json()) as MattermostUser);
  }

  private call<T>(method: string, path: string, body?: unknown): Promise<T> {
    return request<T>(
      this.url,
      method,
      `/api/v4${path}`,
      { Authorization: `Bearer ${this.token}` },
      body,
    );
  }

  async ensureUser(username: string, password: string, firstName: string, teamId: string) {
    const user = await this.call<MattermostUser>("GET", `/users/username/${username}`).catch(
      (error: unknown) => {
        if (!(error instanceof HttpError && error.status === 404)) throw error;
        return this.call<MattermostUser>("POST", "/users", {
          username,
          password,
          first_name: firstName,
          email: `${username}@tryouts.local`,
        });
      },
    );
    await this.call("POST", `/teams/${teamId}/members`, { team_id: teamId, user_id: user.id });
    return user;
  }

  teamId = (name: string) =>
    this.call<{ id: string }>("GET", `/teams/name/${name}`).then((t) => t.id);
  channelId = (teamId: string, name: string) =>
    this.call<{ id: string }>("GET", `/teams/${teamId}/channels/name/${name}`).then((c) => c.id);
  username = (userId: string) =>
    this.call<MattermostUser>("GET", `/users/${userId}`).then((u) => u.username);
  join = (channelId: string) =>
    this.call("POST", `/channels/${channelId}/members`, { user_id: this.me.id });
  post = (channelId: string, message: string) =>
    this.call<Post>("POST", "/posts", { channel_id: channelId, message });
  posts = async (channelId: string, since?: number) => {
    const page = await this.call<{ posts: Record<string, Post> }>(
      "GET",
      `/channels/${channelId}/posts?per_page=200${since === undefined ? "" : `&since=${since}`}`,
    );
    return Object.values(page.posts).sort((a, b) => a.create_at - b.create_at);
  };
}
