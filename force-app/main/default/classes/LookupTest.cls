@IsTest 
public with sharing class LookupTest {

    @testSetup
	private static void setupData() {
        Contact contact1 = TestDataFactory.createContact('test111');
        insert contact1;
        Contact contact2 = TestDataFactory.createContact('test222');
        insert contact2;
    } 

    @isTest static void LookupTest() {
        List<sObject> list1 = Lookup.search('test1', 'Contact', '');
        System.assertEquals(1, list1.size());
        List<sObject> list2 = Lookup.search('', 'Contact', '');
        System.assertEquals(2, list2.size());
    }
}
