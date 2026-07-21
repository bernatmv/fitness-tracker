//
//  ScreenWake.m
//  FitnessTracker
//
//  React Native bridge to keep the screen awake during long operations
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ScreenWake, NSObject)

RCT_EXTERN_METHOD(setKeepAwake:(BOOL)enabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
