//
//  FitnessTrackerWidgetBundle.swift
//  FitnessTrackerWidget
//
//  Created by Bernat Vidal on 3/12/25.
//

import WidgetKit
import SwiftUI

@main
struct FitnessTrackerWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 17.0, *) {
            FitnessTrackerWidget()
        }
        if #available(iOS 16.1, *) {
            FitnessTrackerWidgetLiveActivity()
        }
    }
}
