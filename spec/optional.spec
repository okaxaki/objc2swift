# Optional Type
## Nullability Qualifier
```
@implementation A
-(void)someMethod:(NSString *)arg1 :(nonnull NSString *)arg2 :(nullable NSString *)arg3 {
    //...
}
@end
```

```
class A {
    func someMethod(arg1:String!, arg2:String, arg3:String?) {
        //...
    }
}
```

## Auto-unwrapping
```
@implementation A
-(void)someMethod:(nullable NSString *)str {
    NSLog(@"%l",[str length]);
}
@end
```

```
class A {
    func someMethod(str:String?) {
        NSLog("%l",str!.length())
    }
}
```

## Nullability Annotation

```
NS_ASSUME_NONNULL_BEGIN
@interface AAPLList : NSObject 
// ...
- (nullable AAPLListItem *)itemWithName:(NSString *)name;
- (NSInteger)indexOfItem:(AAPLListItem *)item;

@property (copy, nullable) NSString *name;
@property (copy, readonly) NSArray *allItems;
// ...
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
```

```
class AAPLList : NSObject {
    @NSCopying var name:String?
    @NSCopying private(set) var allItems:[AnyObject]

    func itemWithName(name:String) -> AAPLListItem? {
    	// ...
    }

    func indexOfItem(item:AAPLListItem) -> Int {
        // ...	
    }
}
```
