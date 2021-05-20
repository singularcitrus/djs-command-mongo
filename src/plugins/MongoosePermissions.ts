import Mongoose from "mongoose";
import {
  CommandObj,
  DjsCommandControlClient,
  Plugin,
} from "djs-command-control";
import { GuildMember, Message, PermissionResolvable } from "discord.js";
import Permissions from "../models/Permissions";
import { MongoosePermissionsOptions } from "../types";
import AddPermission from "../commands/AddPermission";
import RemovePermission from "../commands/RemovePermission";
import Commands from "djs-command-control/lib/classes/Commands";

let mongooseGlobal;
let customPerms: string[] = ["PERM_ADMIN"];
let rootAccountId: string;

/**
 * @param mongoose
 * @param options
 */
export default function (
  mongoose: string | typeof Mongoose,
  options: MongoosePermissionsOptions
) {
  const { permissions, rootAccount, mongoOptions } = options;
  rootAccountId = rootAccount;

  if (permissions) customPerms.push(...permissions);
  const plugin = new Plugin("mongoose-permissions");

  if (typeof mongoose === "string") {
    Mongoose.connect(mongoose, mongoOptions);
    mongooseGlobal = Mongoose;
  } else {
    mongooseGlobal = mongoose;
  }

  plugin.initialize = initialize;

  plugin.addBundledCommand(AddPermission(customPerms));
  plugin.addBundledCommand(RemovePermission(customPerms));

  return plugin;
}

function initialize(
  djsCommandControl: DjsCommandControlClient | null,
  ctx: Commands
): DjsCommandControlClient | false {
  if (!djsCommandControl) return false;

  const djs = djsCommandControl;

  djs.FilterCommands.byPermission = byPermission;

  ctx.categories.push({
    name: "permissions",
    title: "Permission Management",
  });

  return djs;
}

async function byPermission(commands: CommandObj[], message: Message) {
  // Filter all commands based on the permissions specified and the user's permissions
  const memberPermissions = await Permissions.findOne({
    type: "USER",
    id: message.author.id,
  });
  return commands.filter((command) => {
    let viable = false;
    if (command.permissions && command.permissions.length > 0) {
      command["permissions"].forEach((permission) => {
        if (checkPermissions(message.member, memberPermissions, permission)) {
          viable = true;
        }
      });
    } else {
      viable = true;
    }
    return viable;
  });
}

function checkPermissions(
  member: GuildMember | null,
  memberPermissions: any,
  permission: string,
  options?: { [p: string]: any } | undefined
) {
  if (!member) return false;

  // First of all, check for Root account, this will always be true
  if (member.user.id === rootAccountId) {
    return true;
  }

  if (customPerms.includes(permission) && memberPermissions) {
    return memberPermissions.permissions.includes(permission);
  } else if (customPerms.includes(permission) && !memberPermissions) {
    return false;
  }
  return member.hasPermission(permission as PermissionResolvable, options);
}
