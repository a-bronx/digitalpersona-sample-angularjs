import { IComponentOptions, IController, IScope, ILocationService } from 'angular';

import { JSONWebToken, User, Ticket } from '@digitalpersona/core';

import UserService from '../user.service';
import template from './userInfo.html';
import { StatusAlert, Success } from '../../common';
import { IdentityService } from '..';
import { IEnrollService, AttributeAction, Attribute, AttributeType, ServiceError } from '@digitalpersona/services';

export default class UserInfoControl// implements IController
{
    public static readonly Component: IComponentOptions = {
        template,
        controller: UserInfoControl,
        bindings: {
            identity: "<",
        },
    };

    public readonly identity: JSONWebToken;

    private busy: boolean = false;
    private status?: StatusAlert;

    private displayName: string;
    private email: string;

    public static $inject = ["$scope", "EnrollService"];
    public constructor(
        private readonly $scope: IScope,
        private readonly enrollService: IEnrollService,
    ){}

    public async $onInit() {
        this.notify();
        this.busy = true;
        const ticket = new Ticket(this.identity);
        const user = User.fromJWT(this.identity);
        try {
            // retrieve personal data
            try {
                const displayName = await this.enrollService.GetUserAttribute(ticket, user, "displayName");
                if (displayName && displayName.values && displayName.values.length > 0)
                    this.displayName = displayName.values[0] as string;
            } catch (e){
                this.notify(new Error(this.mapServiceError(e)));
            }
            try {
                const email = await this.enrollService.GetUserAttribute(ticket, user, "mail");
                if (email && email.values && email.values.length > 0)
                    this.email = email.values[0] as string;
            } catch (e){
                this.notify(new Error(this.mapServiceError(e)));
            }
            this.notify();
        }
        catch (e) {
            this.notify(new Error(this.mapServiceError(e)));
        } finally {
            this.$scope.$apply();
        }
    }

    public updateDisplayName(value: string) {
        this.displayName = value;
    }
    public updateEmail(value: string) {
        this.email = value;
    }

    public async submit() {
        try {
            this.notify();
            this.busy = true;
            const ticket = new Ticket(this.identity);
            const user = User.fromJWT(this.identity);
            // update personal data
            await this.enrollService.PutUserAttribute(ticket
                , user
                , "displayName"
                , this.displayName ? AttributeAction.Update : AttributeAction.Delete
                , new Attribute(AttributeType.String, this.displayName ? [this.displayName] : []));
            await this.enrollService.PutUserAttribute(ticket
                , user
                , "mail"
                , this.email ? AttributeAction.Update : AttributeAction.Delete
                , new Attribute(AttributeType.String, this.email ? [this.email] : []));
            this.notify(new Success('Profile.Info.Update.Success'));
        }
        catch (e) {
            this.notify(new Error(this.mapServiceError(e)));
        } finally {
            this.$scope.$apply();
        }
    }

    private mapServiceError(error: ServiceError) {
        switch (error.code) {
            default: return error.message;
        }
    }
    private notify(status?: StatusAlert) {
        this.busy = false;
        this.status = status;
    }

}
