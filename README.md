# Fantasy Critic Bot

A bot for interacting with your [Fantasy Critic](https://www.fantasycritic.games/) league.

## Bot Features

This bot will allow players to view information about the league, their rosters, and upcoming game release dates. Additionally, it will provide periodic updates on added games, league score updates, and league actions like bid wins and drops.

**NOTE:** Private leagues are not supported at this time.

## Using Bot Commands

Bot Prefix: `fc.`

`fc.setleague [league ID] [year]` - Set your league and year by providing your [league ID](#getting-your-league-id) and year.

`fc.league` - Get the current ranking of all players and their scores.

`fc.pub [publisher name or player name]` - Show details on a publisher via their publisher name or their player name. You only need to provide a portion of their name to search.

`fc.pubgame [game name]` - Show details on a game, as long as that game is in the roster of one of the publishers in the league. You only need to provide a portion of its name to search.

`fc.upcoming` - Show a list of games with upcoming release dates.

`fc.link` - Provies a direct link to the league.

`fc.version` - Current bot version

`fc.help` - Help with using any of the bot's commands.

## Getting your League ID

You can find your League ID in the URL on your league page.

It's the collection of letters and numbers that looks like this:

![image](https://user-images.githubusercontent.com/4060573/164579054-35a4cbdb-fd14-409d-96eb-f63a70884492.png)
