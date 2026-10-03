import SwiftUI

/// Design tokens. Every color, radius, font and spacing in the UI comes from here.
enum Theme {
    enum Colors {
        static let background = dynamic(light: 0xF7F5FA, dark: 0x101013)
        /// Metric cards (tinted with the metric color at the top).
        static let card = dynamic(light: 0xFFFFFF, dark: 0x1D1D20)
        static let cardBorder = dynamic(light: 0xE6E4E9, dark: 0x2A2A2D)
        /// Calendars, stat tiles, settings rows.
        static let surface = dynamic(light: 0xFFFFFF, dark: 0x161619)
        static let surfaceBorder = dynamic(light: 0xE9E7EC, dark: 0x222226)
        /// Inputs and segmented-control tracks.
        static let field = dynamic(light: 0xEFEDF2, dark: 0x19191C)
        static let fieldSelected = dynamic(light: 0xFFFFFF, dark: 0x2B2B31)
        /// Round header buttons.
        static let control = dynamic(light: 0xEBE9EF, dark: 0x2B2B30)
        static let primaryText = dynamic(light: 0x0E0C11, dark: 0xF2F2F4)
        static let secondaryText = dynamic(light: 0x5B5960, dark: 0xA0A0A8)
        static let tertiaryText = dynamic(light: 0x8E8C93, dark: 0x80808A)
        static let separator = dynamic(light: 0xECEAEF, dark: 0x26262A)
        static let accent = dynamic(light: 0x5B4CF0, dark: 0x8B8AF8)
        static let accentSoft = dynamic(light: 0xE8E6FB, dark: 0x2A2948)
        static let onAccent = dynamic(light: 0xFFFFFF, dark: 0x0E0C11)
        /// Glyph on a solid metric-color fill.
        static let onMetric = dynamic(light: 0xFFFFFF, dark: 0x18181B)
        /// Fixed text colors for fills whose brightness is computed (not themed).
        static let inkDark = Color(UIColor(hex: 0x18181B))
        static let inkLight = Color(UIColor(hex: 0xFFFFFF))
        /// Days that haven't happened yet: neutral, never tinted, so they
        /// can't be mistaken for a below-goal day.
        static let futureCell = dynamic(light: 0xF1EFF4, dark: 0x232327)
        static let todayOutline = dynamic(light: 0x3F3F46, dark: 0xD4D4D8)
        static let star = dynamic(light: 0xF59E0B, dark: 0xFBBF24)
        static let pro = dynamic(light: 0xF59E0B, dark: 0xFBBF24)
        static let positive = dynamic(light: 0x16A34A, dark: 0x4ADE80)
    }

    enum Radius {
        static let card: CGFloat = 22
        static let surface: CGFloat = 20
        static let tile: CGFloat = 12
        static let field: CGFloat = 16
        static let dayCell: CGFloat = 10
        /// Heatmap cell corner as a fraction of its side.
        static let cellFraction: CGFloat = 0.28
    }

    enum Spacing {
        static let xxs: CGFloat = 2
        static let xs: CGFloat = 4
        static let s: CGFloat = 8
        static let m: CGFloat = 12
        static let l: CGFloat = 16
        static let xl: CGFloat = 20
        static let xxl: CGFloat = 28
        /// Side margin of screens.
        static let screen: CGFloat = 14
    }

    enum Size {
        static let circleButton: CGFloat = 40
        static let iconTile: CGFloat = 44
        static let headerTile: CGFloat = 52
        static let cta: CGFloat = 56
    }

    enum Grid {
        /// Gap between cells as a fraction of the cell side (HabitKit's 6:21).
        static let gapFraction: CGFloat = 0.29
        /// Week columns on a phone-width card.
        static let cardWeeks = 30
        /// Opacity of a metric color used as a background tint.
        static let tileTint: Double = 0.18
        static let cardTint: Double = 0.07
    }

    static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) })
    }
}

extension Font {
    /// Monospaced digits and labels (HabitKit pairs a grotesk with a mono).
    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }

    static let cardTitle = Font.system(size: 17, weight: .semibold)
    static let cardSubtitle = Font.system(size: 14)
    static let screenTitle = Font.system(size: 24, weight: .bold)
    static let sectionTitle = Font.system(size: 20, weight: .bold)
    static let statNumber = Font.system(size: 28, weight: .bold)
    static let label = Font.system(size: 15)
}
