import Mongoose from "mongoose";
import {
  CommandObj,
  DjsCommandControlClient,
  Plugin,
} from "djs-command-control";
import { MongoClientOptions } from "mongodb";
import {
  GuildMember,
  Message,
  PermissionOverwriteOptions,
  PermissionResolvable,
} from "discord.js";
import Permissions from "../models/Permissions";
import { MongoosePermissionsOptions } from "../types";

let mongooseGlobal;
let customPerms: string[] = [];
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

  return plugin;
}

function initialize(
  djsCommandControl: DjsCommandControlClient | null
): DjsCommandControlClient | false {
  if (!djsCommandControl) return false;

  const djs = djsCommandControl;

  djs.FilterCommands.byPermission = byPermission;

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
