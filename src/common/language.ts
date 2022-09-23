import i18n from '../i18n';
import configurationManager from '../dataManager/configurationManager';

export default function (key: string): string{
    let lang = configurationManager.getConfiguration().language;

    let data = i18n[key] || {};

    return data[lang] || key;
}