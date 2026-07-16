//
//  WidgetUpdater.m
//  FitnessTracker
//
//  React Native bridge for updating widget timelines
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetUpdater, NSObject)

RCT_EXTERN_METHOD(reloadAllTimelines:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end

