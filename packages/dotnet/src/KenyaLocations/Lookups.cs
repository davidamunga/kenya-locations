using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;

namespace KenyaLocations
{
    /*
     * Shared name/code matching used by every Locations lookup. Mirrors the
     * Kotlin, Swift and JS packages:
     *
     * - Numeric codes are zero-padded, so "47" finds county "047".
     * - Names are case-insensitive. If nothing matches exactly, a looser match
     *   that ignores spaces, hyphens, apostrophes and accents is tried
     *   ("Muranga" finds "Murang'a").
     * - A name that matches more than one record resolves to null instead of an
     *   arbitrary record.
     * - County aliases ("Nairobi City") count as names.
     * - Relationships are joined by code (county_code, constituency_code), never by name.
     */
    internal static class Lookups
    {
        internal const int CountyCodeWidth = 3;
        internal const int ConstituencyCodeWidth = 3;

        /// <summary>Lowercase and trim.</summary>
        internal static string LowerName(string value) => value.Trim().ToLowerInvariant();

        /// <summary>Ignore case, accents, spaces and punctuation: "Murang'a" becomes "muranga".</summary>
        internal static string FoldName(string value)
        {
            var decomposed = value.Normalize(NormalizationForm.FormD);
            var folded = new StringBuilder(decomposed.Length);
            foreach (var ch in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
                var lower = char.ToLowerInvariant(ch);
                if ((lower >= 'a' && lower <= 'z') || (lower >= '0' && lower <= '9')) folded.Append(lower);
            }
            return folded.ToString();
        }

        /// <summary>Zero-pad a numeric code to <paramref name="width"/> digits; non-numeric input is returned trimmed.</summary>
        internal static string NormalizeCode(string value, int width)
        {
            var trimmed = value.Trim();
            return trimmed.Length > 0 && trimmed.All(c => c >= '0' && c <= '9')
                ? trimmed.PadLeft(width, '0')
                : trimmed;
        }

        internal static string LocalityKey(string countyCode, string localityName) =>
            countyCode + "|" + LowerName(localityName);
    }

    /// <summary>
    /// Name index: exact (case-insensitive) matches first, folded matches as a fallback.
    /// Aliases are extra names for a record (e.g. a county's "Nairobi City").
    /// </summary>
    internal sealed class NameIndex<T>
    {
        private readonly Dictionary<string, List<T>> _exact;
        private readonly Dictionary<string, List<T>> _folded;

        internal NameIndex(IReadOnlyList<T> items, Func<T, string> name, Func<T, IReadOnlyList<string>>? aliases = null)
        {
            IEnumerable<string> Names(T item) =>
                new[] { name(item) }.Concat(aliases?.Invoke(item) ?? Array.Empty<string>());

            _exact = GroupByKeys(items, item => Names(item).Select(Lookups.LowerName));
            _folded = GroupByKeys(items, item => Names(item).Select(Lookups.FoldName));
        }

        /// <summary>Every record with this name.</summary>
        internal IReadOnlyList<T> All(string name)
        {
            if (_exact.TryGetValue(Lookups.LowerName(name), out var exact)) return exact;
            if (_folded.TryGetValue(Lookups.FoldName(name), out var folded)) return folded;
            return Array.Empty<T>();
        }

        /// <summary>The record with this name, or null if there are none or several.</summary>
        internal T? Unique(string name)
        {
            var matches = All(name);
            return matches.Count == 1 ? matches[0] : default;
        }

        // A record appears at most once per key.
        private static Dictionary<string, List<T>> GroupByKeys(IReadOnlyList<T> items, Func<T, IEnumerable<string>> keys)
        {
            var map = new Dictionary<string, List<T>>(StringComparer.Ordinal);
            foreach (var item in items)
            {
                foreach (var key in keys(item).Distinct(StringComparer.Ordinal))
                {
                    if (!map.TryGetValue(key, out var list)) map[key] = list = new List<T>();
                    list.Add(item);
                }
            }
            return map;
        }
    }
}
