import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  Collection,
} from "discord.js";

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (
    interaction: ChatInputCommandInteraction,
    commands?: Collection<string, Command>
  ) => Promise<void>;
}

export interface WarnEntry {
  moderator: string;
  reason: string;
  timestamp: number;
}

export type HistoryType =
  | "ban"
  | "unban"
  | "timeout"
  | "untimeout"
  | "warn"
  | "delwarn"
  | "ticket_open"
  | "ticket_close";

export interface HistoryEntry {
  type: HistoryType;
  guildId: string;
  targetId: string;
  targetTag: string;
  moderatorTag: string;
  reason: string;
  extra?: string;
  timestamp: number;
}

export const openTickets = new Map<string, string>();
