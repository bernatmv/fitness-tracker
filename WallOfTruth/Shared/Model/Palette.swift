import SwiftUI

/// A metric's color. Every range shade is derived from one base color so all
/// walls share the same rhythm (empty → faint tint → full color), and any
/// palette works in light, dark, tinted and widget contexts.
struct Palette: Identifiable, Hashable, Sendable {
    let id: String
    /// Base color in light appearance (hex RGB).
    let light: UInt32
    /// Base color in dark appearance (hex RGB), slightly brighter.
    let dark: UInt32

    var color: Color {
        Color(UIColor { traits in
            UIColor(hex: traits.userInterfaceStyle == .dark ? self.dark : self.light)
        })
    }

    /// How the five levels are built: solid colors, not transparency, so
    /// every tier stays saturated and distinct on cards, widgets and blurs.
    /// Level 0 ("not met") is a faint tint, 1–2 climb toward the base color,
    /// 3 is the base and 4 steps past it. On dark the ladder tops out at
    /// the base itself (brighter = more); on light the peak goes deeper.
    static let darkMix: [Double] = [0.11, 0.32, 0.56, 0.80]
    static let lightMix: [Double] = [0.13, 0.34, 0.62, 1.0]
    static let peakShift: Double = 0.32

    static func components(hex: UInt32, level: Int, dark: Bool) -> (r: Double, g: Double, b: Double) {
        let base = (Double((hex >> 16) & 0xFF) / 255, Double((hex >> 8) & 0xFF) / 255, Double(hex & 0xFF) / 255)
        func mix(_ a: (Double, Double, Double), _ b: (Double, Double, Double), _ t: Double) -> (r: Double, g: Double, b: Double) {
            (a.0 + (b.0 - a.0) * t, a.1 + (b.1 - a.1) * t, a.2 + (b.2 - a.2) * t)
        }
        let level = min(max(level, 0), 4)
        // Card backgrounds: #1D1D20 dark; light uses a soft grey floor so
        // empty days stay visible on white.
        let floor = dark ? (0.114, 0.114, 0.125) : (level == 0 ? (0.93, 0.925, 0.94) : (1.0, 1.0, 1.0))
        if level == 4 {
            return dark ? (base.0, base.1, base.2) : mix(base, (0.08, 0.06, 0.10), peakShift * 0.75)
        }
        return mix(floor, base, (dark ? darkMix : lightMix)[level])
    }

    /// Whether text on a tier's fill should be dark, by the fill's luminance.
    func prefersDarkText(level: Int, dark: Bool) -> Bool {
        let c = Palette.components(hex: dark ? self.dark : light, level: level, dark: dark)
        return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.5
    }

    func color(level: Int) -> Color {
        Color(UIColor { traits in
            let dark = traits.userInterfaceStyle == .dark
            let c = Palette.components(hex: dark ? self.dark : self.light, level: level, dark: dark)
            return UIColor(red: c.r, green: c.g, blue: c.b, alpha: 1)
        })
    }

    /// Tailwind 500 shades in light mode, 400 in dark (HabitKit's picker).
    static let all: [Palette] = [
        Palette(id: "red", light: 0xEF4444, dark: 0xF87171),
        Palette(id: "orange", light: 0xF97316, dark: 0xFB923C),
        Palette(id: "amber", light: 0xF59E0B, dark: 0xFBBF24),
        Palette(id: "yellow", light: 0xEAB308, dark: 0xFACC15),
        Palette(id: "lime", light: 0x84CC16, dark: 0xA3E635),
        Palette(id: "green", light: 0x22C55E, dark: 0x4ADE80),
        Palette(id: "emerald", light: 0x10B981, dark: 0x34D399),
        Palette(id: "teal", light: 0x14B8A6, dark: 0x2DD4BF),
        Palette(id: "cyan", light: 0x06B6D4, dark: 0x22D3EE),
        Palette(id: "sky", light: 0x0EA5E9, dark: 0x38BDF8),
        Palette(id: "blue", light: 0x3B82F6, dark: 0x60A5FA),
        Palette(id: "indigo", light: 0x6366F1, dark: 0x818CF8),
        Palette(id: "violet", light: 0x8B5CF6, dark: 0xA78BFA),
        Palette(id: "purple", light: 0xA855F7, dark: 0xC084FC),
        Palette(id: "fuchsia", light: 0xD946EF, dark: 0xE879F9),
        Palette(id: "pink", light: 0xEC4899, dark: 0xF472B6),
        Palette(id: "rose", light: 0xF43F5E, dark: 0xFB7185),
        Palette(id: "slate", light: 0x64748B, dark: 0x94A3B8),
        Palette(id: "gray", light: 0x6B7280, dark: 0x9CA3AF),
        Palette(id: "neutral", light: 0x737373, dark: 0xA3A3A3),
        Palette(id: "stone", light: 0x78716C, dark: 0xA8A29E),
    ]

    static let fallback = all[0]

    static func with(id: String) -> Palette {
        all.first { $0.id == id } ?? fallback
    }

    /// Palette IDs used by the React Native app, mapped to their closest match.
    static let legacyIDs: [String: String] = [
        "github_green": "green",
        "ios_health_red": "red",
        "ios_health_green": "green",
        "ios_health_blue": "blue",
        "ios_health_purple": "purple",
        "ocean_blue": "sky",
        "sunset_orange": "orange",
        "lavender_purple": "purple",
        "monochrome_gray": "gray",
        "fire_red": "red",
        "tropical_teal": "teal",
        "amber_gold": "amber",
        "deep_purple": "violet",
        "rose_pink": "pink",
        "cyan_blue": "cyan",
        "indigo_night": "indigo",
        "lime_green": "lime",
    ]
}

extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}
