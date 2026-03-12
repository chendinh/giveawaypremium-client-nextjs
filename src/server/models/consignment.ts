export class Consignment extends Parse.Object {
  constructor() {
    // Pass the ClassName to the Parse.Object constructor
    super('Consignment');
    // All other initialization
    // this.sound = 'Rawr';
  }

  public getConsigner(): Parse.User {
    return this.get('consigner')
  }
}

Parse.Object.registerSubclass('Consignment', Consignment);
