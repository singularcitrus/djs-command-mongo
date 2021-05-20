import { Message } from "discord.js";
import { ModifiedClient } from "djs-command-control";

export async function PermissionPreCheck(
  message: object | Message | undefined,
  customPerms: string[]
): Promise<{ client: ModifiedClient; permission: string, id: string } | false> {
  if (!message) return false;
  if (!(message instanceof Message)) return false;

  const args = message.content.split(" ");

  const client: ModifiedClient = message.client as ModifiedClient;

  const id = args[1];
  const permission = args[2].toUpperCase();

  if (!customPerms.includes(permission)) {
    await message.channel.send(
      client.djsCommandControl
        .getEmbed()
        .setTitle("Error")
        .setDescription("Invalid Permission")
    );
    return false;
  }

  return { client, permission, id };
}
