import { HttpError, request } from "./http";

export interface User {
  id: string;
  name: string;
  email: string;
}

export type AppKind = "mattermost" | "slack" | "discord";

export interface Bridge {
  bridge_id: string;
  bridge_type: AppKind;
  display_name: string;
  is_default: boolean;
  agent_greetings_enabled: boolean;
}

export interface Controller {
  id: string;
  name: string;
  state: string;
  status: { providers?: { provider: string; installed: boolean; auth: string }[] } | null;
}

export interface Agent {
  id: string;
  name: string;
  display_name: string | null;
  owner_id: string | null;
  owner_name: string | null;
  created_at: string;
}

export type Provider = "opencode" | "codex" | "claude";

export interface ManagedAgentDefinition {
  provider: Provider;
  model: string | null;
  instructions: string;
  directory: string;
  auto_mode: boolean;
  auto_approve: boolean;
}

export interface ManagedAgent {
  id: string;
  name: string;
  created_at: string;
  definition: ManagedAgentDefinition;
}

export type UsageMetric =
  | "messages"
  | "turns"
  | "input_tokens"
  | "output_tokens"
  | "cache_read_tokens"
  | "cache_write_tokens";

export interface UsageTotal {
  metric: UsageMetric;
  client_id: string;
  client_name: string;
  client_type: string;
  model: string;
  amount: number;
}

export interface Budget {
  id: string;
  agent_id: string | null;
  agent_name: string | null;
  metric: UsageMetric;
  model: string;
  amount_limit: number;
  period_hours: number;
  spent: number;
  resets_at: string;
  exhausted: boolean;
}

export interface AddressingRule {
  rooms?: "*" | string[];
  room_groups?: "*" | string[];
  users?: "*" | string[];
  agents?: "*" | string[];
  owner?: boolean;
  owner_agents?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  external_channel_url: string | null;
  created_at: string;
}

export interface RoomDetail extends Room {
  bridge_id: string | null;
  agent_ids: string[];
  connected_user_names: string[];
  owner_id: string | null;
  owner_name: string | null;
}

export interface ChatSummary {
  roomId: string;
  name: string;
  bridgeType: AppKind | null;
  agents: { id: string; name: string; displayName: string | null }[];
}

export interface ChatMessage {
  messageId: string;
  sentAt: string;
  sender: {
    clientId: string;
    name: string;
    kind: "human" | "agent" | "system";
    agentId: string | null;
  };
  body: string;
}

export interface ApprovalRecord {
  requestId: string;
  agentId: string;
  sessionId: string;
  roomId: string | null;
  title: string;
  detail: string | null;
  state: "open" | "answered" | "expired" | "cancelled";
  answer: string | null;
  answeredBy: string | null;
  answeredAt: string | null;
  options: { id: string; label: string; decision?: string }[];
}

export const commandOf = (approval: ApprovalRecord) => approval.detail ?? approval.title;

export const administers = (tenant: { role: string }) =>
  tenant.role === "admin" || tenant.role === "owner";

export class Gateway {
  private constructor(
    readonly url: string,
    private readonly cookie: string,
  ) {}

  static async login(url: string, email: string, password: string): Promise<Gateway> {
    const response = await fetch(`${url}/gateway/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new HttpError(response.status, "POST", "/gateway/auth/login", await response.text());
    }
    const token = /switch_auth=([^;]+)/.exec(response.headers.get("set-cookie") ?? "")?.[1];
    if (!token) throw new Error(`Switch accepted the login for ${email} but set no session.`);
    return new Gateway(url, `switch_auth=${token}`);
  }

  private call<T>(method: string, path: string, body?: unknown): Promise<T> {
    return request<T>(this.url, method, `/gateway${path}`, { Cookie: this.cookie }, body);
  }

  loginAs = (email: string, password: string) => Gateway.login(this.url, email, password);

  me = () => this.call<User>("GET", "/auth/me");
  identities = () =>
    this.call<{ id: string; bridge_id: string; external_user_id: string }[]>(
      "GET",
      "/auth/me/identities",
    );
  users = () => this.call<User[]>("GET", "/users");
  createUser = (name: string, email: string, password: string) =>
    this.call<User>("POST", "/users", { name, email, password });

  bridges = () => this.call<Bridge[]>("GET", "/collaborations");
  registerBridge = (
    type: AppKind,
    displayName: string,
    connectionConfig: Record<string, string | boolean>,
  ) =>
    this.call<Bridge>("POST", "/collaborations", {
      bridge_type: type,
      display_name: displayName,
      connection_config: connectionConfig,
    });
  findPlatformUser = (bridgeId: string, query: string) =>
    this.call<{ users: { external_user_id: string; username: string }[] }>(
      "GET",
      `/collaborations/${bridgeId}/directory?query=${encodeURIComponent(query)}`,
    ).then((result) => result.users.find((user) => user.username === query) ?? null);
  bridgeAccounts = (bridgeId: string) =>
    this.call<{ external_username: string; claimed_by: { user_name: string }[] }[]>(
      "GET",
      `/collaborations/${bridgeId}/users`,
    );
  setAgentGreetings = (bridgeId: string, enabled: boolean) =>
    this.call("PATCH", `/collaborations/${bridgeId}`, { agent_greetings_enabled: enabled });
  claimIdentity = (bridgeId: string, externalUserId: string, username: string) =>
    this.call<{ id: string }>("POST", `/collaborations/${bridgeId}/identities`, {
      external_user_id: externalUserId,
      username,
    });

  enrollmentCode = () =>
    this.call<{ code: string }>("POST", "/management/enrollment-codes").then((r) => r.code);
  controllers = () => this.call<Controller[]>("GET", "/management/controllers");
  createManagedAgent = (agent: {
    name: string;
    display_name: string;
    description: string;
    controller_id: string;
    definition: ManagedAgentDefinition;
  }) =>
    this.call<{ agent_id: string }>("POST", "/management/agents", {
      ...agent,
      desired_state: "running",
    });

  updateManagedAgent = (agentId: string, definition: ManagedAgentDefinition) =>
    this.call("PATCH", `/management/agents/${agentId}`, { definition });

  agents = () => this.call<Agent[]>("GET", "/agents");
  managedAgent = (agentId: string) =>
    this.call<ManagedAgent>("GET", `/management/agents/${agentId}`);
  setMemberRole = (tenantId: string, userId: string, role: "admin" | "member") =>
    this.call("PATCH", `/tenants/${tenantId}/members/${userId}`, { role });
  tenants = () => this.call<{ id: string; slug: string; role: string }[]>("GET", "/tenants");
  usage = (tenantId: string, since: Date, until: Date) =>
    this.call<UsageTotal[]>(
      "GET",
      `/tenants/${tenantId}/usage?since=${encodeURIComponent(since.toISOString())}&until=${encodeURIComponent(until.toISOString())}`,
    );
  createBudget = (
    tenantId: string,
    budget: {
      agent_id: string;
      metric: UsageMetric;
      model: string;
      amount_limit: number;
      period_hours: number;
    },
  ) => this.call<Budget>("POST", `/tenants/${tenantId}/budgets`, budget);
  budgets = (tenantId: string) => this.call<Budget[]>("GET", `/tenants/${tenantId}/budgets`);
  addAgentsToRoom = (roomId: string, agentIds: string[]) =>
    this.call("POST", `/rooms/${roomId}/agents`, { agent_ids: agentIds });
  setAddressingPolicy = (agentId: string, rules: AddressingRule[]) =>
    this.call("PUT", `/agents/${agentId}/addressing-policy`, { policy: { rules } });

  rooms = () => this.call<Room[]>("GET", "/rooms");
  room = (id: string) => this.call<RoomDetail>("GET", `/rooms/${id}`);
  deleteRoom = (id: string) => this.call("DELETE", `/rooms/${id}?retire_channel=true`);
  templates = (query: string) =>
    this.call<{ id: string; name: string }[]>("GET", `/templates?q=${encodeURIComponent(query)}`);
  saveTemplate = (template: { name: string; description: string; kind: string; content: string }) =>
    this.call<{ id: string }>("POST", "/templates", template);
  updateTemplate = (id: string, content: string) =>
    this.call("PATCH", `/templates/${id}`, { content });
  runTemplate = (template: string, inputs: Record<string, unknown>, templateName: string) =>
    this.call("POST", "/rooms/from-template-document", {
      template,
      inputs,
      template_name: templateName,
    });

  chats = () => this.call<{ chats: ChatSummary[] }>("GET", "/chats").then((r) => r.chats);
  joinChat = (roomId: string, userId: string) =>
    this.call("POST", `/chats/${roomId}/members`, { userId });
  chatMessages = (roomId: string) =>
    this.call<{ messages: ChatMessage[] }>("GET", `/chats/${roomId}/messages?limit=200`).then(
      (page) => page.messages,
    );
  openApprovals = () => this.call<ApprovalRecord[]>("GET", "/agent-sessions/approvals");
  answerApproval = (approval: ApprovalRecord, decision: "accept" | "decline") => {
    const option = approval.options.find((o) => o.decision === decision);
    if (!option) throw new Error(`The card "${approval.title}" has no ${decision} option.`);
    return this.call<ApprovalRecord>(
      "POST",
      `/agent-sessions/${approval.agentId}/${approval.sessionId}/approvals/${approval.requestId}/answer`,
      { answer: option.id },
    );
  };
  chatApprovals = (roomId: string) =>
    this.call<{ approvals: ApprovalRecord[] }>("GET", `/chats/${roomId}/activity`).then(
      (activity) => activity.approvals,
    );
}
