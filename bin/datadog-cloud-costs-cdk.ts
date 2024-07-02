#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatadogCloudCostsCdkStack } from '../lib/datadog-cloud-costs-cdk-stack';

const app = new cdk.App();
const accounts = ['402324894655', '775794411819'];

accounts.forEach(account => {
    new DatadogCloudCostsCdkStack(app, `DatadogCloudCostsCdkStack-${account}`, {
        synthesizer: new cdk.DefaultStackSynthesizer(
            {generateBootstrapVersionRule: false}
        ),
        env: {
            account: account,
            region: 'us-east-1'
        },
        DatadogIntegrationRole: `arn:aws:iam::${account}:role/DatadogIntegrationRole`,
        s3Prefix: 'datadog-cloud-costs',
        reportName: 'datadog-cloud-costs-report',
        timeUnit: 'HOURLY',
        format: 'textORcsv',
        compression: 'GZIP',
        additionalSchemaElements: ['REGION', 'SPLIT_COST_ALLOCATION_DATA'],
        region: 'us-east-1',
    });
});