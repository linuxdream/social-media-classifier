module.exports = function(req, res, next) {
    /**
     * This is simply to be sure that the request contains the proper key. Set default
     * X-Key to asdf incase no ENV var is set.
     */
    if(_.get(req, 'headers[x-key]', 'asdf') !== _.get(process, 'env.nlp_app_key')){
        return res.forbidden('This application is not permitted to make API requests.');
    }else{
        return next();
    }
};
