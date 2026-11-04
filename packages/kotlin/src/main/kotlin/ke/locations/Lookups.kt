package ke.locations

import java.text.Normalizer

/*
 * Shared name/code matching used by every KenyaLocations lookup:
 *
 * - Numeric codes are zero-padded, so "47" finds county "047".
 * - Names are case-insensitive. If nothing matches exactly, a looser match
 *   that ignores spaces, hyphens, apostrophes and accents is tried
 *   ("Muranga" finds "Murang'a").
 * - A name that matches more than one record resolves to null instead of an
 *   arbitrary record.
 */

internal const val COUNTY_CODE_WIDTH = 3
internal const val CONSTITUENCY_CODE_WIDTH = 3

private val combiningMarks = Regex("\\p{Mn}+")
private val nonAlphanumeric = Regex("[^a-z0-9]")

/** Lowercase and trim. */
internal fun lowerName(value: String): String = value.trim().lowercase()

/** Ignore case, accents, spaces and punctuation: "Murang'a" → "muranga". */
internal fun foldName(value: String): String =
    Normalizer.normalize(value, Normalizer.Form.NFD)
        .replace(combiningMarks, "")
        .lowercase()
        .replace(nonAlphanumeric, "")

/** Zero-pad a numeric code to [width] digits; non-numeric input is returned trimmed. */
internal fun normalizeCode(value: String, width: Int): String {
    val trimmed = value.trim()
    return if (trimmed.isNotEmpty() && trimmed.all { it in '0'..'9' }) trimmed.padStart(width, '0') else trimmed
}

/** Name index: exact (case-insensitive) matches first, folded matches as a fallback. */
internal class NameIndex<T>(items: List<T>, name: (T) -> String) {
    private val exact: Map<String, List<T>> = items.groupBy { lowerName(name(it)) }
    private val folded: Map<String, List<T>> = items.groupBy { foldName(name(it)) }

    /** Every record with this name. */
    fun all(name: String): List<T> =
        exact[lowerName(name)] ?: folded[foldName(name)] ?: emptyList()

    /** The record with this name, or null if there are none or several. */
    fun unique(name: String): T? = all(name).singleOrNull()
}
