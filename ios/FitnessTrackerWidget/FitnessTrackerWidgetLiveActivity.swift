//
//  FitnessTrackerWidgetLiveActivity.swift
//  FitnessTrackerWidget
//
//  Created by Bernat Vidal on 3/12/25.
//

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct FitnessTrackerWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

@available(iOS 16.1, *)
struct FitnessTrackerWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FitnessTrackerWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension FitnessTrackerWidgetAttributes {
    fileprivate static var preview: FitnessTrackerWidgetAttributes {
        FitnessTrackerWidgetAttributes(name: "World")
    }
}

extension FitnessTrackerWidgetAttributes.ContentState {
    fileprivate static var smiley: FitnessTrackerWidgetAttributes.ContentState {
        FitnessTrackerWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: FitnessTrackerWidgetAttributes.ContentState {
         FitnessTrackerWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: FitnessTrackerWidgetAttributes.preview) {
   FitnessTrackerWidgetLiveActivity()
} contentStates: {
    FitnessTrackerWidgetAttributes.ContentState.smiley
    FitnessTrackerWidgetAttributes.ContentState.starEyes
}
