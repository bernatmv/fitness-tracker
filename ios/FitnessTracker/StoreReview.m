//
//  StoreReview.m
//  FitnessTracker
//
//  React Native bridge to SKStoreReviewController
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(StoreReview, NSObject)

RCT_EXTERN_METHOD(requestReview:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
