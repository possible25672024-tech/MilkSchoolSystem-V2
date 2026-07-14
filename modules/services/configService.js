/**
 * Config Service
 */

class ConfigService {

    getSchool() {

        return window.SCHOOL;

    }

    getTheme() {

        return window.THEME;

    }

}

window.ConfigService = new ConfigService();