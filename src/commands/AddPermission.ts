// Relative Requires
import Permissions from "../models/Permissions";
import { Command } from "djs-command-control";
import { Message } from "discord.js";
import { PermissionPreCheck } from "../Helper";

export default function (customPerms: string[]) {
  const command = new Command();
  command.name = "Add Permission";
  command.description = "Add a permission to a user ID";
  command.invokes = ["addperm"];
  command.usage = "{{User ID}} {{Permission}}";
  command.execute = async function (
    message: object | Message | undefined
  ): Promise<void> {
    const preCheck = await PermissionPreCheck(message, customPerms);
    if (!preCheck) return;
    const { client, permission, id } = preCheck;

    if (!(await Permissions.exists({ type: "USER", id }))) {
      await new Permissions({
        type: "USER",
        id,
        permissions: [permission],
      }).save();
      await (message as Message).channel.send(
        client.djsCommandControl
          .getEmbed()
          .setTitle("Success")
          .setDescription(
            `Permission ${permission} added to ${id} as the only one`
          )
      );
      return;
    } else {
      const existingPermission = await Permissions.findOne({
        type: "USER",
        id,
      });
      if (existingPermission.permissions.includes(permission)) {
        await (message as Message).channel.send(
          client.djsCommandControl
            .getEmbed()
            .setTitle("Error")
            .setDescription("User already has that permission")
        );
        return;
      }
      existingPermission.permissions.push(permission);
      await Permissions.findOneAndUpdate(
        { type: "USER", id },
        existingPermission
      );
      await (message as Message).channel.send(
        client.djsCommandControl
          .getEmbed()
          .setTitle("Success")
          .setDescription(`Permission ${permission} added to ${id}`)
      );
      return;
    }
  };
  command.category = "permissions";
  command.permissions = ["PERM_ADMIN"];

  return command;
}
