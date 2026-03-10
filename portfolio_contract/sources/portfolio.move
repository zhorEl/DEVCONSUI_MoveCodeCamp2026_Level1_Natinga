module portfolio::portfolio {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::package;
    use sui::display;
    use std::string::{Self, String};

    struct Portfolio has key, store {
        id: UID,
        name: String,
        course: String,
        school: String,
        about: String,
        linkedin_url: String,
        github_url: String,
        skills: String,
    }

    struct PORTFOLIO has drop {}

    fun init(otw: PORTFOLIO, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"creator"),
            string::utf8(b"school"),
            string::utf8(b"course"),
            string::utf8(b"linkedin"),
            string::utf8(b"github"),
        ];
        
        let values = vector[
            string::utf8(b"Smart Contracts Code Camp Portfolio of {name}"),
            string::utf8(b"Proof of Learning Portfolio project proudly built and published with informed consent during a Move Smart Contracts Code Camp by DEVCON Philippines & Sui Foundation — where the participant wrote, tested, and deployed a Move smart contract on Sui Mainnet. The object's immutability serves one purpose: the participant's authorship and timestamp cannot be altered, removed, or claimed by anyone else."),
            string::utf8(b"{name}"),
            string::utf8(b"{school}"),
            string::utf8(b"{course}"),
            string::utf8(b"{linkedin_url}"),
            string::utf8(b"{github_url}"),
        ];
        
        // Create the Display object
        let display = display::new_with_fields<Portfolio>(
            &publisher,
            keys,
            values,
            ctx
        );
        
        // CRITICAL: Update version to commit the Display!
        // This emits an event that full nodes use to apply the template [citation:4]
        display::update_version(&mut display);
        
        // Transfer both objects
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    public fun create_portfolio(
        sender: address,
        name: String,
        course: String,
        school: String,
        about: String,
        linkedin_url: String,
        github_url: String,
        skills: String,
        ctx: &mut TxContext
    ) {
        let portfolio = Portfolio {
            id: object::new(ctx),
            name,
            course,
            school,
            about,
            linkedin_url,
            github_url,
            skills,
        };
        transfer::transfer(portfolio, sender);
    }
}
