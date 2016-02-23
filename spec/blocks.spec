# Blocks

## Blocks as Variable

```
void (^blk)(int) = ^(int a) {
    // ...
};
```

```
let blk:(Int)->Void = { (a:Int) in 
    // ...
}
```

## Blocks as Property
```
@interface Foo
@property void(^blk)(NSString *);
@end

@implementation Foo
-(void)method {
    blk = ^(NSString *msg){
        NSLog(@"In block: %@", msg);
        // ...
    };
}
@end
```

```
class Foo {
    var blk:(String!)->Void

    func method() {
        blk = { (msg:String!) in 
            NSLog("In block: %@", msg)
            // ...
        }
    }
}
```

## Blocks as Parameter

```
@implementation Foo
-(void)method:(void (^)(int))blk {
    // ...
}
@end
```

```
class Foo {
    func method(blk:(Int)->Void) {
        // ...
    }
}
```

## Direct Blocks Declaration
<p style="color:red;">This pattern  is not supported yet.</p>
```
/** Not Supported yet */
void (^blk)(int) {
    // ...
};
```

```
/** Not Supported yet */
func blk() {
    // ...
};
```

