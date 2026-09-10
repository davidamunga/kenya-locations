/// Represents a ward in Kenya.
///
/// Associates a ward with its unique administrative code, name, and
/// parent constituency.
class Ward {
  /// Creates a [Ward] with the given administrative code, name, and parent
  /// constituency.
  const new({
    required this.code,
    required this.name,
    required this.constituency,
  });

  /// Creates a [Ward] from a map containing ward data.
  ///
  /// The map is expected to contain the following keys:
  /// - `code`
  /// - `name`
  /// - `constituency`
  factory fromMap(Map<String, dynamic> map) => Ward(
    code: map['code'] as String,
    name: map['name'] as String,
    constituency: map['constituency'] as String,
  );

  /// The unique administrative code of the ward.
  final String code;

  /// The name of the ward.
  final String name;

  /// The name of the constituency that contains the ward.
  final String constituency;
}
