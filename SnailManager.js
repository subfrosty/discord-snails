const Discord = require('discord.js');
const { EventEmitter } = require('node:events');
const { writeFile, readFile, access } = require('node:fs/promises');

// const serialize = require('serialize-javascript');
const { deepmerge } = require('deepmerge-ts');

const SnailUser = require('./SnailUser.js');
const Snail = require('./Snail.js');

const {
    StatPointOptions,
    SnailData,
    SnailManagerOptions,
    SnailCreationOptions
} = require('./SnailConstants.js');

class SnailManager extends EventEmitter {
    /**
     * @param {Discord.Client} client The Discord Client
     * @param {boolean} [init=true]
     */

    constructor(client, options, init = true) {
        super();
        if (!client?.options) throw new Error(`Client is a required option. (val=${client})`);

        /**
         * The Discord Client
         * @type {Discord.Client}
         */
        this.client = client;
        /**
         * The Snails managed by this manager
         * @type {Snail[]}
         */
        this.snails = [];
        /**
         * The manager options
         * @type {SnailManagerOptions}
         */
        this.options = deepmerge(SnailManagerOptions, options || {})

        if (init) this._init();

    }

    /**
     * Generate an embed to display information about given Snail
     * @param {Snail} snail The snail
     * @returns {Discord.EmbedBuilder} The generated embed
     */
    generateInfoEmbed(snail, first) {
        // console.log(`https://cdn.discordapp.com/avatars/${snail.ownerUser.avatar}.png`)


        // console.log(snail.stat_points['strength'])
        const embed =
            new Discord.EmbedBuilder()
                .setTitle(`${snail.ownerUser.tag}'s Snail:`)
                .setThumbnail(`https://cdn.discordapp.com/avatars/${snail.ownerUser.id}/${snail.ownerUser.avatar}.webp`)
                .setDescription(`A ${snail.colour}, ${snail.trait} snail.`)
                .setColor('#f5425d')
                .addFields(
                    { name: 'Name:', value: snail.name, inline: true },
                    { name: 'Equipped:', value: snail.equipped, inline: true },
                    { name: 'Gold', value: `${snail.gold}`, inline: true },
                    { name: '\u200b', value: '\u200b' },
                    { name: 'Energy', value: `${snail.energy} / 20`, inline: true },
                    { name: 'Strength', value: `${snail.stat_points.strength } / 100`, inline: true },
                    { name: 'Persuasion', value: `${snail.stat_points.persuasion} / 100`, inline: true },
                    { name: 'Vitality', value: `${snail.stat_points.vitality} / 100`, inline: true },
                    { name: 'Magic', value: `${snail.stat_points.magic} / 100`, inline: true },
                    { name: 'Speed', value: `${snail.stat_points.speed} / 100`, inline: true },
                    { name: 'Power Level', value: `${snail.powerLevel}` },
                )
                .setFooter({
                    text: `Battles Won: ${snail.battlesWon}`
                })
                .setTimestamp()

            
        return snail.fillInEmbed(embed);
    }

    /**
     * Gets the Snails from the storage file, or create it
     * @ignore
     * @returns {Promise<SnailData[]>}
     */
    async getAllSnails() {
        // Check storage exists
        const storageExists = await access(this.options.storage)
            .then(() => true)
            .catch(() => false);
        
        // Storage doesn't exist
        if (!storageExists) {
            // Create storage file
            await writeFile(this.options.storage, '[]', 'utf-8');
            return [];
        } else {
            // Storage file exists, read it
            const storageContent = await readFile(this.options.storage, { encoding: 'utf-8' });
            if (!storageContent.trim().startsWith('[') || !storageContent.trim().endsWith(']')) {
                console.log(storageContent)
                throw new SyntaxError('The storage file is not properly formatted (does not contain an array).')
            }

            try {
                console.log(storageContent)
                return await JSON.parse(storageContent, (_, v) =>
                    typeof v === 'string' && /BigInt\("(-?\d+)"\)/.test(v) ? eval(v) : v
                );
            } catch (err) {
                if (err.message.startsWith('Unexpected token')) {
                    throw new SyntaxError(
                        `${err.message} | LINK: (${require('path').resolve(this.options.storage)}:1:${err.message
                            .split(' ')
                            .at(-1)})`
                    );
                }
                throw err;
            }
        }

    }

    /**
     * Creates a new Snail
     * @param {SnailCreationOptions} options Options for the snail.
     * @returns {Promise<Snail>} The created snail.
     */
    create(interaction, options) {
        return new Promise(async (resolve, reject) => {
            if (!this.ready) return reject('The manager is not ready yet.');

            const snail = new Snail(this, {
                ownerUser: interaction.user,
                owner: interaction.user.id
            })

            const embed = this.generateInfoEmbed(snail, true);
            const message = await interaction.editReply({
                embeds: [embed],
                ephemeral: true
            });

            snail.snailId = interaction.message.id;
            this.snails.push(snail);
            await this.saveSnail(interaction.user.id, snail.data);
            // console.log(snail.data)
            resolve(snail);
        })
    }


    /**
     * Save the Snail in the database
     * @ignore
     * @param {Discord.User} ownerId The owner user of the Snail
     * @param {SnailData} snailData The Snail data to save
     */
    async saveSnail(ownerId, snailData) {
        // console.log(snail.data)
        await writeFile(
            this.options.storage,
            JSON.stringify(
                this.snails.map((snail) => snail.data),
                (_, v) => (typeof v === 'bigint' ? serialize(v) : v)
            ),
            'utf-8'
        );
        return;
    }

    /**
     * Save the Snail in the database
     * @ignore
     * @param {Discord.User} ownerId The owner user of the Snail
     * @param {SnailData} snailData The Snail data to save
     */
    async editSnail(ownerId, snailData) {
        await writeFile(
            this.options.storage,
            JSON.stringify(
                this.snails.map((snail) => snail.data),
                (_, v) => (typeof v === 'bigint' ? serialize(v) : v)
            ),
            'utf-8'
        );
        return;
    }


    async _init() {
        let rawSnails = await this.getAllSnails();

        await (this.client.readyAt ? Promise.resolve() : new Promise((resolve) => this.client.once('ready', resolve)));

        if (this.client.shard && this.client.guilds.cache.size) {
            const shardId = Discord.ShardClientUtil.shardIdForGuildId(
                this.client.guilds.cache.first().id,
                this.client.shard.count
            );

            rawSnails = rawSnails.filter(
                (g) => shardId === Discord.ShardClientUtil.shardIdForGuildId(g.guildId, this.client.shard.count)
            )
        }
        

        rawSnails.forEach((snail) => {
            // console.log(snail)
            this.snails.push(new Snail(this, snail))
        });

        this.ready = true;



    }
}

module.exports = { SnailManager };
