package com.fitnesstracker

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * Widget Provider for Fitness Tracker
 * Handles widget updates and lifecycle events
 */
class FitnessTrackerWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update all widget instances
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Called when the first widget is added
    }

    override fun onDisabled(context: Context) {
        // Called when the last widget is removed
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        // Handle custom update intents
        if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, FitnessTrackerWidgetProvider::class.java)
            )
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Load widget data from SharedPreferences
        val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
        val metricName = prefs.getString("metric_name", "Fitness Tracker") ?: "Fitness Tracker"
        
        // Create RemoteViews
        // Note: Use resources.getIdentifier for now since R class may not be generated yet
        val layoutId = context.resources.getIdentifier(
            "fitness_tracker_widget",
            "layout",
            context.packageName
        )
        
        if (layoutId == 0) {
            // Fallback if layout not found
            return
        }
        
        val views = RemoteViews(context.packageName, layoutId)
        
        // Update widget content
        val titleId = context.resources.getIdentifier(
            "widget_title",
            "id",
            context.packageName
        )
        
        if (titleId != 0) {
            views.setTextViewText(titleId, metricName)
        }
        
        // TODO: Render activity wall grid
        // This will be implemented to draw the heat map cells
        
        // Tell the AppWidgetManager to perform an update on the current app widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}

