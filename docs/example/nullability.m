NS_ASSUME_NONNULL_BEGIN
@interface AAPLList : NSObject <NSCoding, NSCopying>
- (nullable AAPLListItem *)itemWithName:(NSString *)name;
- (NSInteger)indexOfItem:(AAPLListItem *)item;
@property (copy, nullable) NSString *name;
@property (copy, readonly) NSArray *allItems;
@end
NS_ASSUME_NONNULL_END

@implementation AAPLList
- (nullable AAPLListItem *)itemWithName:(NSString *)name {
    // ...
}

- (NSInteger)indexOfItem:(AAPLListItem *)item {
    // ...      
}
@end
