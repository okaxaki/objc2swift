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