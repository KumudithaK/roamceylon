import {commonMessages} from "./common-messages";
import {journeyMessages} from "./journey-messages";
import {publicMessages} from "./public-messages";
import type {Translations} from "./locale";

export const messages:Translations={...publicMessages,...journeyMessages,...commonMessages};
