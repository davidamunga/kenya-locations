using System;

namespace KenyaLocations
{
    internal static class Fuzzy
    {
        /// <summary>
        /// Relevance score in [0.0, 1.0) for <paramref name="pattern"/> against <paramref name="text"/>, or null
        /// if there is no fuzzy match. 0.0 is an exact substring (perfect); higher is worse.
        /// Exact substring first, then a Levenshtein sliding window with
        /// maxErrors = max(1, floor(patternLength * 0.4)); a match needs a best window score of 0.4 or less.
        /// Identical to the Kotlin implementation, so results agree across languages.
        /// </summary>
        internal static double? Score(string pattern, string text)
        {
            var p = pattern.ToLowerInvariant();
            var t = text.ToLowerInvariant();

            if (t.IndexOf(p, StringComparison.Ordinal) >= 0) return 0.0;
            if (p.Length < 2) return null;

            var pLen = p.Length;
            var tLen = t.Length;
            var maxErrors = Math.Max(1, (int)(pLen * 0.4));
            var windowSize = pLen + maxErrors;

            var best = double.MaxValue;
            for (var start = 0; start <= Math.Max(0, tLen - 1); start++)
            {
                var end = Math.Min(start + windowSize, tLen);
                var distance = Levenshtein(p, t.Substring(start, end - start));
                if (distance <= maxErrors)
                {
                    var score = (double)distance / pLen;
                    if (score < best) best = score;
                }
                if (best == 0.0) break;
            }

            return best <= 0.4 ? best : null;
        }

        /// <summary>Space-optimised Levenshtein distance: O(min(m, n)) space.</summary>
        internal static int Levenshtein(string s, string t)
        {
            var m = s.Length;
            var n = t.Length;
            if (m == 0) return n;
            if (n == 0) return m;

            var dp = new int[n + 1];
            for (var j = 0; j <= n; j++) dp[j] = j;

            for (var i = 1; i <= m; i++)
            {
                var prev = dp[0];
                dp[0] = i;
                for (var j = 1; j <= n; j++)
                {
                    var temp = dp[j];
                    dp[j] = s[i - 1] == t[j - 1]
                        ? prev
                        : 1 + Math.Min(prev, Math.Min(dp[j], dp[j - 1]));
                    prev = temp;
                }
            }
            return dp[n];
        }
    }
}
