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

let mongooseGlobal;
let customPerms: string[] = [];

/**
 * @param mongoose
 * @param {string[]} permissions List of valid custom permissions for your commands
 * @param mongoOptions
 */
export default function (
  mongoose: string | typeof Mongoose,
  permissions: string[] | undefined = [],
  mongoOptions: MongoClientOptions | undefined
) {
  if (permissions) customPerms = permissions;
  const plugin = new Plugin("mongoose-permissions");

  if (typeof mongoose === "string") {
    Mongoose.connect(mongoose, mongoOptions);
    mongooseGlobal = Mongoose;
  } else {
    mongooseGlobal = mongoose;
  }

  plugin.initialize = initialize;
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
  if (member.user.id === process.env.ROOT_ACCOUNT_ID) {
    return true;
  }

  if (customPerms.includes(permission) && memberPermissions) {
    return memberPermissions.permissions.includes(permission);
  } else if (customPerms.includes(permission) && !memberPermissions) {
    return false;
  }
  return member.hasPermission(permission as PermissionResolvable, options);
}
