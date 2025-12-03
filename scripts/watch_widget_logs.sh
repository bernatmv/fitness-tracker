#!/bin/bash
# Watch widget logs in real-time
# Usage: ./scripts/watch_widget_logs.sh

echo "Watching widget logs... (Press Ctrl+C to stop)"
echo "Filtering for: WidgetDataManager, FitnessTrackerWidget, App Group"
echo ""

xcrun simctl spawn booted log stream \
  --predicate 'processImagePath contains "FitnessTracker"' \
  --level debug 2>&1 | \
  grep -E "(WidgetDataManager|FitnessTrackerWidget|App Group|App Group storage|health data|preferences)" \
  --line-buffered

