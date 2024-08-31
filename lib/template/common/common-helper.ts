/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm'


export interface ICommonHelper {
    findEnumType<T extends object>(enumType: T, target: string): T[keyof T];
    exportOutput(key: string, value: string, prefixEnable?: boolean, prefixCustomName?: string): void;
    putParameter(paramKey: string, paramValue: string, prefixEnable?: boolean, prefixCustomName?: string): string;
    getParameter(paramKey: string, prefixEnable?: boolean, prefixCustomName?: string): string;
    putVariable(variableKey: string, variableValue: string): void;
    getVariable(variableKey: string): string;
}

export interface CommonHelperProps {
    stackName: string;
    projectPrefix: string;
    construct: Construct;
    env: cdk.Environment;
    variables: any;
}

export class CommonHelper implements ICommonHelper {
    protected stackName: string;
    protected projectPrefix: string;
    protected props: CommonHelperProps;

    constructor(props: CommonHelperProps) {
        this.stackName = props.stackName;
        this.props = props;
        this.projectPrefix = props.projectPrefix;
    }

    // 실제로 존재하는 target 값인지 확인하는 절차
    public findEnumType<T extends object>(enumType: T, target: string): T[keyof T] {
        type keyType = keyof typeof enumType;

        const keyInString = Object.keys(enumType).find(key =>
            // console.log(`${key} = ${enumType[key as keyof typeof enumType]}`);
            // (<any>EnumType)['StringKeyofEnumType']
            target == `${enumType[key as keyof typeof enumType]}` as string
        );

        const key = keyInString as keyType;
        return enumType[key];
    }

    // CDK 스택간의 의존성 관리 및 다른 스택간 리소스 접근 목적
    public exportOutput(key: string, value: string, prefixEnable=true, prefixCustomName?: string) {
        if (prefixEnable) {
            const prefix = prefixCustomName ? prefixCustomName : this.projectPrefix;
            new cdk.CfnOutput(this.props.construct, `Output-${key}`, {
                exportName: `${prefix}-${key}`,
                value: value
            });
        } else {
            new cdk.CfnOutput(this.props.construct, `Output-${key}`, {
                exportName: key,
                value: value
            });
        }
    }

    // ssm 에 파라미터를 저장하는 역할
    public putParameter(paramKey: string, paramValue: string, prefixEnable=true, prefixCustomName?: string): string {
        if (prefixEnable) {
            const paramKeyWithPrefix = prefixCustomName ? `${prefixCustomName}-${paramKey}` : `${this.projectPrefix}-${paramKey}`;

            new ssm.StringParameter(this.props.construct, paramKey, {
                parameterName: paramKeyWithPrefix,
                stringValue: paramValue,
            });
        } else {
            new ssm.StringParameter(this.props.construct, paramKey, {
                parameterName: paramKey,
                stringValue: paramValue,
            });
        }

        return paramKey;
    }

    // ssm 에 있는 파라미터 값을 조회하는 역할
    public getParameter(paramKey: string, prefixEnable=true, prefixCustomName?: string): string {
        if (prefixEnable) {
            const paramKeyWithPrefix = prefixCustomName ? `${prefixCustomName}-${paramKey}` : `${this.projectPrefix}-${paramKey}`;

            return ssm.StringParameter.valueForStringParameter(
                this.props.construct,
                paramKeyWithPrefix
            );
        } else {
            return ssm.StringParameter.valueForStringParameter(
                this.props.construct,
                paramKey
            );
        }
    }

    //
    public putVariable(variableKey: string, variableValue: string) {
        this.props.variables[variableKey] = variableValue;
    }

    public getVariable(variableKey: string): string {
        return this.props.variables[variableKey];
    }
}
