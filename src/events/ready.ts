import { Events, type Client } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
    client.user?.setActivity("Serveur protégé 🛡️");
  },
};
