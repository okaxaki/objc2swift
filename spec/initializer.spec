# Initializer

## Alloc &amp; Init


```
void test() {
    Foo *foo;
    foo = [[Foo alloc] init];
    // ...
}
```


```
func test() {
    var foo:Foo!
    foo = Foo()
    // ...
}
```

## Designated Initializer
<p>Designated Initializer is partially supported. The signature can be coverted but inner implementation is not modified.</p>
```
@implementation Foo
-(id)init {
    self = [super init]; // Remains in Swift code
    if(self) { // Remains in Swift code
        // ...
    }
    return self; // Remains in Swift code
}

-(instancetype)initWithFrame:(CGRect) frame {
    // ...
}
@end
```


```
class Foo {
    init() {
        self = super.init() // Remains in Swift code
        if (self != nil) { // Remains in Swift code
            // ...
        }
        return self // Remains in Swift code
    }

    init(frame:CGRect) {
        // ...
    }
}
```