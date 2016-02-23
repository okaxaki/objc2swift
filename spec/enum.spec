# Enumeration
<p>
Note: Enumeration conversion specification will be fixed. Currently the converter treats the enum type name as the prefix of each enumerators.
This results approximatly fine, but strictly, it is different from Swift's behavior.
</p>

## Enumeration Declaration

```
typedef NS_ENUM(NSUInteger, Animal) {
    AnimalSwift,
    AnimalLion,
    AnimalPanther,
    AnimalTiger,
};
```

```
enum Animal:UInt {
    case Swift
    case Lion
    case Panther
    case Tiger
}
```

## Enumeration Reference

```
typedef NS_ENUM(NSUInteger, Animal) {
    AnimalSwift,
    AnimalLion,
    AnimalPanther,
    AnimalTiger,
};

@implementation MyClass
-(NSString *)someMethod:(MyColor)color {
    switch(color) {
        case AnimalLion:
        case AnimalPanther:
        case AnimalTiger:
            return "OS X code name";
        case AnimalSwift:
            return "Language name";
        default:
            return NULL;
    }
}
@end
```

```
enum Animal:UInt {
    case Swift
    case Lion
    case Panther
    case Tiger
}

class MyClass {
    func someMethod(color:MyColor) -> String! {
        switch(color) { 
            case Animal.Lion,
                 Animal.Panther,
                 Animal.Tiger:
                return "OS X code name"
            case Animal.Swift:
                return "Language name"
            default:
                return nil
        }
    }
}
```