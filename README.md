# fitness-tracker

Mobile app to keep track of your fitness habits with a github-like wall of activity in widgets.

## Description

This is a cross-platform (iOS and Android) mobile app create with React Native.

This mobile app:

- Syncs with the fitness data of the user from each platform health app:

  - Calories burned/Active energy
  - Exercises time
  - Standing time
  - Steps
  - Floors climbed
  - Hours of sleep
  - Exercises (with all their data)

- Displays a github-like activity wall for each one where the user can configure (we have default values for all those):

  - Color (different ranges based on lighter/darker versions of the base color)
  - Thresholds for the ranges (threshold values for each range, eg: Calories burned has darkest color for daily values below 800, slightly lighter for 800-950, then 950-1200 and lightest for over 1200)

- For each category we can add a phone widget that display the wall either as a full row, double full row or full screen.

- The app asks for permission to sync all data the first time it is used

- The app syncs frequently each day for missing data, evaluate possibilities:
  - Each time the app is open (the widget will not look proper sometimes)
  - Hook to health data activities (is it possible?)
  - Once every hour (is it possible?)
  - Suggest a better solution
