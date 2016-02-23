# Property

## Readonly Property
<p>The property with <code>readonly</code> attribute is converted to a variable and its setter is set private.</p>
```
@interface MyClass 
@property (readonly) NSString *str;
@end

@implementation MyClass
@end
```

```
class MyClass {
    private(set) var str:String!
}
```

## Copy Property
```
@interface MyClass 
@property (copy) NSString *str;
@end

@implementation MyClass
@end
```

```
class MyClass {
    @NSCopying var str:String!
}
```

## Private Property
<p>The property declared in any anonymous category is converted into a private variable. Other properies are treated as public.</p>
```
@interface MyClass
@property int bar;
@end

@interface MyClass ()
@property int baz;
@end

@implementation MyClass 
@end
```

```
class MyClass { 
    var bar:Int
    private var baz:Int
}
```

## Auto-synthesizing Aware
<p>Objective-C automatically synthesizes instantce variable <code>_foo</code> for <code>@property</code> foo declaration. Objc2swift checks the reference of _foo in any instance method and if so, explicit setter and getter functions are generated for safe.

```
@interface MyClass 
@property NSString *foo; // This property implicitly generates `_foo`.
@end

@implementation MyClass 
-(void)someMethod {
	NSLog("%@", _foo); // reference of auto-synthesized variable.
}
@end
```

```
class MyClass { 
    private var _foo:String!
    var foo:String! {
        get { return _foo }
        set { _foo = newValue }
    }

    func someMethod() {
    	NSLog("%@", _foo) // reference of auto-synthesized variable.
    }
}
```

## Setter and Getter
<p>If there are setter and getter code in the class implementation, they are converted into Swift's variables with setter and getter function.</p>

```
@interface MyClass
@property int foo;
@end

@implementation MyClass 
-(void)setFoo:(int)value {
    _foo = foo * 2;
}
-(int)foo {
    return _foo / 2;
}
@end
```

```
class MyClass { 
    private var _foo:Int
    var foo:Int {
        get { 
            return _foo / 2
        }
        set(value) { 
            _foo = foo * 2
        }
    }

    // `setFoo:` has moved as a setter.
    // `foo` has moved as a getter.
}
```