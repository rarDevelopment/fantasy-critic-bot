const FCDataLayer = require('../FCDataLayer.js');
const ScoreRounder = require('../ScoreRounder.js');
const ranked = require('ranked');

class PublisherScoreSubUpdater {
    async scoreUpdate(leagueYear, channelToSend, sendMessagesFunction) {
        const publishersApiData = leagueYear.publishers.map((publisher) => {
            return {
                publisherID: publisher.publisherID,
                leagueID: publisher.leagueID,
                publisherName: publisher.publisherName,
                playerName: publisher.playerName,
                totalFantasyPoints: publisher.totalFantasyPoints,
            };
        });

        const publisherScoresCache = await FCDataLayer.getPublisherScores(leagueYear.leagueId);

        if (!publisherScoresCache || publisherScoresCache.length === 0) {
            await FCDataLayer.initPublisherScores(publishersApiData);
            return;
        }

        const rankedCache = ranked.ranking(publisherScoresCache, (pubScore) => pubScore.totalFantasyPoints);
        const rankedApi = ranked.ranking(publishersApiData, (pubScore) => pubScore.totalFantasyPoints);

        let publisherScoresToUpdate = [];
        let updatesToAnnounce = [];

        rankedApi.forEach((rankedPublisher) => {
            const publisherScoreToCheck = rankedPublisher.item;
            const publisherInCache = publisherScoresCache.find(
                (p) => p.publisherID === publisherScoreToCheck.publisherID
            );

            const nameToShow = `${publisherScoreToCheck.publisherName} (Player: ${publisherScoreToCheck.playerName})`;
            if (!publisherInCache) {
                publisherScoresToUpdate.push(publisherScoreToCheck);
                updatesToAnnounce.push(
                    `**${nameToShow}** now has a score of **${ScoreRounder.round(
                        publisherScoreToCheck.totalFantasyPoints,
                        1
                    )}** and is now in **${this.formatRankNumber(rankedPublisher.rank)}** place.`
                );
            } else {
                if (publisherScoreToCheck.totalFantasyPoints !== publisherInCache.totalFantasyPoints) {
                    publisherScoresToUpdate.push(publisherScoreToCheck);
                    if (!publisherInCache.totalFantasyPoints) {
                        updatesToAnnounce.push(
                            `**${nameToShow}** now has a score of **${ScoreRounder.round(
                                publisherScoreToCheck.totalFantasyPoints,
                                1
                            )}** and is now in **${this.formatRankNumber(rankedPublisher.rank)}** place.`
                        );
                    } else {
                        const roundedCacheScore = ScoreRounder.round(publisherInCache.totalFantasyPoints, 1);
                        const roundedApiScore = ScoreRounder.round(publisherScoreToCheck.totalFantasyPoints, 1);
                        const scoreDiff = roundedCacheScore - roundedApiScore;
                        if (scoreDiff !== 0 && Math.abs(scoreDiff) >= 1) {
                            const direction = scoreDiff < 0 ? 'UP' : 'DOWN';
                            let updateMessage = `**${nameToShow}**'s score has gone **${direction}** from **${roundedCacheScore}** to **${roundedApiScore}**`;
                            if (this.didRankChange(publisherScoreToCheck.publisherID, rankedCache, rankedApi)) {
                                updateMessage += ` and is now in **${this.formatRankNumber(
                                    rankedPublisher.rank
                                )}** place.`;
                            }
                            updatesToAnnounce.push(updateMessage);
                        }
                    }
                }
                if (publisherScoreToCheck.publisherName !== publisherInCache.publisherName) {
                    publisherScoresToUpdate.push(publisherScoreToCheck);
                    updatesToAnnounce.push(
                        `Publisher **${publisherInCache.publisherName}** is now known as **${publisherScoreToCheck.publisherName}**`
                    );
                }
                if (publisherScoreToCheck.playerName !== publisherInCache.playerName) {
                    publisherScoresToUpdate.push(publisherScoreToCheck);
                }
            }
        });

        await FCDataLayer.updatePublisherScores(publisherScoresToUpdate);

        sendMessagesFunction(updatesToAnnounce, '**Publisher Updates!**', channelToSend);
    }

    didRankChange(publisherId, rankCache, rankApi) {
        const rankBefore = rankCache.find((p) => p.item.publisherID === publisherId);
        const rankAfter = rankApi.find((p) => p.item.publisherID === publisherId);
        if (!rankAfter) {
            return false;
        }
        return rankBefore.rank !== rankAfter.rank;
    }

    formatRankNumber(rankNumber) {
        const numberToFormat = rankNumber.toString();
        let suffix = 'th';
        if (!numberToFormat.endsWith('11') && !numberToFormat.endsWith('12') && !numberToFormat.endsWith('13')) {
            if (numberToFormat.endsWith('1')) {
                suffix = 'st';
            } else if (numberToFormat.endsWith('2')) {
                suffix = 'nd';
            } else if (numberToFormat.endsWith('3')) {
                suffix = 'rd';
            }
        }
        return `${numberToFormat}${suffix}`;
    }
}

module.exports = new PublisherScoreSubUpdater();
