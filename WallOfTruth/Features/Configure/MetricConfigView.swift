import SwiftUI

/// Edit a metric's color and ranges, with a live preview of its wall.
struct MetricConfigView: View {
    let metric: Metric
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    private var settings: MetricSettings { model.preferences[metric] }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                MetricCard(metric: metric, settings: settings, series: model.history(metric), wallStyle: .weeks, locked: false)
                    .allowsHitTesting(false)
                VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                    SectionLabel("config.ranges")
                    RangeEditor(metric: metric, settings: settings) { bounds in
                        model.update(metric) { $0.thresholds = bounds }
                    }
                }
                VStack(alignment: .leading, spacing: Theme.Spacing.m) {
                    SectionLabel("config.color")
                    PalettePicker(selection: settings.paletteID) { id in
                        model.update(metric) { $0.paletteID = id }
                    }
                }
                Button("config.reset") {
                    model.update(metric) {
                        let defaults = MetricSettings.defaults(for: metric)
                        $0.thresholds = defaults.thresholds
                        $0.paletteID = defaults.paletteID
                    }
                }
                .font(.scaled(15, weight: .medium))
                .foregroundStyle(Theme.Colors.secondaryText)
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, Theme.Spacing.xl)
            .readableWidth()
            .padding(.bottom, Theme.Spacing.xxl)
            .animation(.smooth(duration: 0.2), value: settings)
        }
        .scrollIndicators(.hidden)
        .safeAreaInset(edge: .top) {
            SheetHeader(title: Text(verbatim: metric.title)) { dismiss() }
        }
        .screenBackground()
        .presentationDragIndicator(.visible)
    }
}

/// Four range rows, each with its color swatch and a lower bound stepper.
private struct RangeEditor: View {
    let metric: Metric
    let settings: MetricSettings
    let onChange: ([Double]) -> Void
    @State private var editing: Int?
    @State private var draft = ""

    var body: some View {
        VStack(spacing: 0) {
            ForEach((0..<settings.scale.bounds.count).reversed(), id: \.self) { index in
                HStack(spacing: Theme.Spacing.m) {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(settings.palette.color(level: index + 1))
                        .frame(width: 24, height: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(RangeName.text(index + 1)).font(.scaled(15, weight: .medium))
                        Text("config.from").font(.scaled(12)).foregroundStyle(Theme.Colors.tertiaryText)
                    }
                    Spacer()
                    stepButton("minus", index: index, direction: -1)
                    // Tap to type an exact value; ± nudges by one step.
                    Button {
                        draft = ThresholdInput.editableText(settings.scale.bounds[index], for: metric)
                        editing = index
                    } label: {
                        Text(metric == .sleep ? MetricFormat.value(settings.scale.bounds[index], for: metric) : MetricFormat.number(settings.scale.bounds[index], for: metric))
                            .font(.mono(16, weight: .semibold))
                            .lineLimit(1)
                            .contentTransition(.numericText())
                            .frame(minWidth: 76)
                            .padding(.vertical, 6)
                            .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(Theme.Colors.field))
                    }
                    .buttonStyle(.plain)
                    stepButton("plus", index: index, direction: 1)
                }
                .padding(.vertical, Theme.Spacing.m)
                .accessibilityElement(children: .contain)
                Divider().overlay(Theme.Colors.separator)
            }
            HStack(spacing: Theme.Spacing.m) {
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(settings.palette.color(level: 0))
                    .frame(width: 24, height: 24)
                Text(RangeName.text(0)).font(.scaled(15, weight: .medium))
                Spacer()
                Text("< " + MetricFormat.value(settings.scale.goal, for: metric))
                    .font(.mono(15)).foregroundStyle(Theme.Colors.secondaryText)
            }
            .padding(.vertical, Theme.Spacing.m)
        }
        .padding(.horizontal, Theme.Spacing.l)
        .surface()
        .alert(Text(RangeName.text((editing ?? 0) + 1)), isPresented: Binding(get: { editing != nil }, set: { if !$0 { editing = nil } })) {
            TextField(metric == .sleep ? "config.hours" : "config.value", text: $draft)
                .keyboardType(.decimalPad)
            Button("common.cancel", role: .cancel) {}
            Button("common.save") {
                if let index = editing, let value = ThresholdInput.parse(draft, for: metric) {
                    onChange(ThresholdScale.adjusting(settings.scale.bounds, index: index,
                                                      by: value - settings.scale.bounds[index], step: metric.thresholdStep))
                }
            }
        } message: {
            Text(metric == .sleep ? "config.hours.hint" : "config.value.hint")
        }
    }

    private func stepButton(_ symbol: String, index: Int, direction: Double) -> some View {
        Button {
            onChange(ThresholdScale.adjusting(settings.scale.bounds, index: index, by: direction * metric.thresholdStep, step: metric.thresholdStep))
        } label: {
            Image(systemName: symbol)
                .font(.scaled(13, weight: .bold))
                .frame(width: 34, height: 34)
                .background(Circle().fill(Theme.Colors.field))
        }
        .buttonStyle(.plain)
        .buttonRepeatBehavior(.enabled)
        .foregroundStyle(Theme.Colors.primaryText)
        .accessibilityLabel(Text(direction > 0 ? "config.increase" : "config.decrease"))
    }
}

/// 7 × 3 grid of color swatches.
struct PalettePicker: View {
    let selection: String
    let onSelect: (String) -> Void

    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: Theme.Spacing.s + 2), count: 7), spacing: Theme.Spacing.s + 2) {
            ForEach(Palette.all) { palette in
                Button { onSelect(palette.id) } label: {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(palette.color)
                        .aspectRatio(1, contentMode: .fit)
                        .padding(selection == palette.id ? 4 : 0)
                        .overlay {
                            if selection == palette.id {
                                RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(palette.color, lineWidth: 2)
                            }
                        }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(Text(verbatim: palette.id))
                .accessibilityAddTraits(selection == palette.id ? .isSelected : [])
            }
        }
        .padding(Theme.Spacing.l)
        .surface()
    }
}
