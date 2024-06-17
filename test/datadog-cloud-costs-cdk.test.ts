
import { Capture, Match, Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import { DatadogCloudCostsCdkStack } from "../lib/datadog-cloud-costs-cdk-stack";

describe("DataDogCloudCostStack", () => {
    test("synthesizes the way we expect", () => {
        const app = new cdk.App();

        // Since the StateMachineStack consumes resources from a separate stack
        // (cross-stack references), we create a stack for our SNS topics to live
        // in here. These topics can then be passed to the StateMachineStack later,
        // creating a cross-stack reference.
        const topicsStack = new cdk.Stack(app, "TopicsStack");

        // Create the topic the stack we're testing will reference.
        const topics = [new sns.Topic(topicsStack, "Topic1", {})];

        const ddccs = new DatadogCloudCostsCdkStack(app, "DatadogCloudCostsCdkStack", {
            env: {
                account: '402324894655',
                region: 'us-east-1'
            },
            DatadogIntegrationRole: 'arn:aws:iam::402324894655:role/DatadogIntegrationRole',
            s3Prefix: 'datadog-cloud-costs',
            reportName: 'datadog-cloud-costs-report'
        });

        // Prepare the stack for assertions.
        const template = Template.fromStack(ddccs);


    }
    );
});