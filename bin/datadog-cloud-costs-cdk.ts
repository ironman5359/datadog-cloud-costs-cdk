#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatadogCloudCostsCdkStack } from '../lib/datadog-cloud-costs-cdk-stack';

const app = new cdk.App();
const accounts = ['402324894655'];

accounts.forEach(account => {
    new DatadogCloudCostsCdkStack(app, `DatadogCloudCostsCdkStack-${account}`, {
        env: {
            account: account,
            region: 'us-east-1'
        },
        DatadogIntegrationRole: 'arn:aws:iam::402324894655:role/DatadogIntegrationRole',
        s3Prefix: 'datadog-cloud-costs',
        reportName: 'datadog-cloud-costs-report'
    });
});