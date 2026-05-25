export interface AgentConfig {
  id: string;
  name: string;
  provider?: string;
  model?: string;
}

export interface AgentHandleResult {
  text: string;
  shouldEscalate?: boolean;
}

export interface IAgent {
  readonly id: string;
  handle(message: string, userId: string): Promise<string | AgentHandleResult>;
  getConfig(): AgentConfig;
}
