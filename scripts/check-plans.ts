import dbConnect from "@/lib/db";
import SubscriptionPlan from "@/models/SubscriptionPlan";

async function checkPlans() {
    await dbConnect();
    console.log("Checking for Subscription Plans...");

    const allPlans = await SubscriptionPlan.find({});
    console.log(`Found ${allPlans.length} total plans.`);

    const centerPlans = await SubscriptionPlan.find({ targetRole: 'CENTER' });
    console.log(`Found ${centerPlans.length} CENTER plans.`);
    console.log(JSON.stringify(centerPlans, null, 2));
}

checkPlans().then(() => process.exit());
