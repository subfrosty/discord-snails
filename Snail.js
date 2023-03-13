const { cuteNames, adjectives, colorCombinations, rpgItems} = require('./snailAdlib.js');
const Discord = require('discord.js')

class Snail {
    constructor(manager, options) {
        // console.log(options)
        // super();

        this.manager = manager;
        this.owner = options.owner,
        this.ownerUser = options.ownerUser,
        this.alive = options.alive || true,
        this.regenSpeed = options.regenSpeed || 60,
        this.gold = options.gold || 0,
        this.battlesWon = options.battlesWon || 0,
        this.energy = options.energy || 20,
        this.colour = options.colour || colorCombinations[Math.floor(Math.random() * colorCombinations.length)],
        this.trait = options.trait || adjectives[Math.floor(Math.random() * adjectives.length)],
        this.equipped = options.equipped || rpgItems[Math.floor(Math.random() * rpgItems.length)],
        this.name = options.name || cuteNames[Math.floor(Math.random() * cuteNames.length)],
        this.stat_points = options.stat_points || {
            strength: Math.floor((Math.random() * 15) + 1),
            persuasion: Math.floor((Math.random() * 15) + 1),
            vitality: Math.floor((Math.random() * 15) + 1),
            magic: Math.floor((Math.random() * 15) + 1),
            speed: Math.floor((Math.random() * 15) + 1),
        }

        setInterval(() => {
            if (this.energy < 20) {
                this.energy++;
                // console.log(this.energy)
            }
        }, this.regenSpeed * 1000)
    }

    get powerLevel() {
        const stats = Object.values(this.stat_points);
        console.log(stats)
        let initialValue = 0;
        return (stats.reduce((accumulator, currentValue) => accumulator + currentValue,
        initialValue
        ) / 5);
    }

    get data() {
        return {
            owner: this.owner,
            ownerUser: this.ownerUser,
            alive: this.alive,
            battlesWon: this.battlesWon,
            gold: this.gold,
            energy: this.energy,
            colour: this.colour,
            trait: this.trait,
            equipped: this.equipped,
            name: this.name,
            stat_points: this.stat_points
        }
    }

    /**
     * Fills in a string with snail props
     * @param {string} string The string to fill 
     * @returns {?string} The filled in string
     */
    fillInString(string) {
        if (typeof string !== 'string') return null;
        [...new Set(string.match(/\{[^{}]{1,}\}/g))]
            .filter((match) => match?.slice(1, -1).trim() !== '')
            .forEach((match) => {
                let replacer;
                try {
                    replacer = eval(match.slice(1, -1));
                } catch {
                    replacer = match;
                }
                string = string.replaceAll(match, replacer);
            });
        return string.trim();
    }

    /**
     * Fills in an embed with snail props
     * @param {Discord.JSONEncodable<Discord.APIEmbed>|Discord.APIEmbed} embed The embed that should be filled
     * @returns {?Discord.EmbedBuilder} The filled in embed.
     */
    fillInEmbed(embed) {
        if (!embed || typeof embed !== 'object') return null;
        embed = Discord.EmbedBuilder.from(embed);
        embed.setTitle(this.fillInString(embed.data.title));
        embed.setDescription(this.fillInString(embed.data.description));
        if (typeof embed.data.author?.name === 'string')
            embed.data.author.name = this.fillInString(embed.data.author.name);
        if (typeof embed.data.footer?.text === 'string')
            embed.data.footer.text = this.fillInString(embed.data.footer.text);
        if (embed.data.fields?.length)
            embed.spliceFields(
                0,
                embed.data.fields.length,
                ...embed.data.fields.map((f) => {
                    f.name = this.fillInString(f.name);
                    f.value = this.fillInString(f.value);
                    return f;
                })
            );
        return embed;
    }

    _resolveStat(stat) {
        let statToTrain;
        switch (stat.toLowerCase()) {
            case 'st':
                statToTrain = 'strength'
                break
            case 'sp':
                statToTrain = 'speed'
                break
            case 'v':
                statToTrain = 'vitality'
                break
            case 'p':
                statToTrain = 'persuasion'
                break
            case 'm':
                statToTrain = 'magic'
                break
        }

        
        return statToTrain;
    }

    _getRandomProperty(obj) {
        const keys = Object.keys(obj);
      
        return keys[Math.floor(Math.random() * keys.length)];
    }

    _addStatPoints(stat, amount) {
        return this.stat_points[stat] += amount;

    }

    battleWin() {
        const statsAdded = [];
        // Add 1-5 points to 2 random stats
        for (let i = 0; i < 2; i++) {
            const statName = this._getRandomProperty(this.stat_points);
            // console.log(statName)
            const statAmountAdded = Math.floor((Math.random() * 3) + 1);
            this._addStatPoints(statName, statAmountAdded)
            statsAdded.push([statName, statAmountAdded])
        }

        this.battlesWon++;
        this.energy--;

        this.manager.editSnail(this.ownerId, this.data)
        this._addGold(50);

        return statsAdded;
    }

    battleLose() {
        this.energy -= 5;
    }

    trainStat(stat) {
        // console.log(stat)
        // console.log(this.stat_points[stat])
        this.energy--;
        this._addStatPoints(stat, 1)

        this.manager.editSnail(this.ownerId, this.data);

        return `${this.name}'s ` + '`' + stat + '`' +  ` stat has been increased by 1 (${this.stat_points[stat]}/100) \nEnergy-- (${this.energy} / 20)`
    }

    _addGold(amount) {
        this.gold += amount;
        this.manager.editSnail(this.ownerId, this.data);
        return amount;
    }
}

module.exports = Snail;