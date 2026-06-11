/**
 * Calculate points for a prediction against actual match result.
 * Correct winner (or draw): 5 pts
 * Exact home goals: +1 pt
 * Exact away goals: +1 pt
 * Max: 7 pts
 */
export function calculatePoints(
  prediction: { homeGoals: number; awayGoals: number },
  match: { homeScore: number | null; awayScore: number | null; status: string }
): number | null {
  if (match.status !== "finished" || match.homeScore === null || match.awayScore === null) {
    return null;
  }

  const predWinner = Math.sign(prediction.homeGoals - prediction.awayGoals);
  const actualWinner = Math.sign(match.homeScore - match.awayScore);

  let points = 0;

  if (predWinner === actualWinner) {
    points += 3;
  }

  if (prediction.homeGoals === match.homeScore && prediction.awayGoals === match.awayScore) {
    points += 1;
  }

  return points;
}
