const Discord = require('discord.js');

/**
 * Creation Options for new Snails
 * @typedef SnailCreationOptions
 * 
 * @property {Discord.User} owner The Owner user of the snail
 */
exports.SnailCreationOptions = {};


/**
 * @typedef StatPointOptions
 * 
 * @property {number} strength Strength stat points
 * @property {number} vitality Vitality stat points
 * @property {number} speed Speed stat points
 * @property {number} magic magic stat points
 * @property {number} persuasion Persuasion stat points
 */
exports.StatPointOptions = {
    strength: 0,
    vitality: 0,
    speed: 0,
    magic: 0,
    persuasion: 0,
}

/**
 * @typedef SnailManagerOptions
 * 
 * @property {string} storage Storage path for snails
 */

exports.SnailManagerOptions = {
    storage: './snails.json'
}


/**
 * Raw Snail Object (to store in the database)
 * @typedef SnailData
 * 
 * @property {string} owner The owner id
 * @property {Discord.User} ownerUser The owner's user
 * @property {number} snailId The messageId
 * @property {number} regenSpeed Snail's health regen speed (default 1hp/60sec)
 * @property {number} gold The amount of gold this snail has.
 * @property {string} name The name of the snail
 * @property {string} trait The trait of the snail
 * @property {string} colour The colour of the snail
 * @property {string} equipped The item equipped of the snail
 * @property {number} energy Amount of energy the snail has
 * @property {number} battlesWon Number of battles the snail has won
 * @property {string} name The name of the snail
 * @property {StatPointOptions} [stat_points] The snail's stats
 */
exports.SnailData = {};