import { Collection, GuildMember, User } from 'discord.js';
import { Command, CommandDecorators, Message, Middleware } from 'yamdbf';
import { BotClient } from '../../client/botClient';
import { moderatorOnly } from '../../util/decorators/moderation';

const { resolve, expect } = Middleware;
const { using } = CommandDecorators;

export default class extends Command<BotClient> {
    constructor() {
        super({
            name: 'ban',
            desc: 'Ban a user from the server.',
            usage: '<prefix>ban <user> <...reason>',
            group: 'mod',
            guildOnly: true
        });
    }

    @moderatorOnly
    @using(resolve('user: User, ...reason: String'))
    @using(expect('user: User, ...reason: String'))
    async action(message: Message, [user, reason]: [User, string]): Promise<any> {
        if (message.author.id === user.id) {
            return message.channel.send('You cannot ban yourself.');
        }

        let member: GuildMember;
        try {
            member = await message.guild.fetchMember(user);
        } catch {}

        const modRole = await message.guild.storage.settings.get('modrole');
        if (
            (member && member.roles.has(modRole)) ||
            user.id === message.guild.ownerID ||
            user.bot
        ) {
            return message.channel.send('You cannot use this command on this user.');
        }

        const bans: Collection<string, User> = await message.guild.fetchBans();
        if (bans.has(user.id)) {
            return message.channel.send('That user is already banned in this server.');
        }

        const banning: Message = (await message.channel.send(`Banning **${user.tag}**`)) as Message;
        try {
            message.guild.ban(user, { reason: reason, days: 7 });
        } catch (err) {
            return banning.edit(`Error occured while banning **${user.tag}**. Error: ${err}`);
        }
        return banning.edit(`Successfully banned **${user.tag}**`);
    }
}
