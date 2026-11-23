package io.dataease.system.manage;

import io.dataease.api.permissions.auth.dto.BusiPerCheckDTO;
import io.dataease.bluewing.service.BluewingPermissionService;
import io.dataease.license.config.XpackInteract;
import io.dataease.utils.CommonBeanFactory;
import org.springframework.stereotype.Component;

@Component
public class CorePermissionManage {

    @XpackInteract(value = "corePermissionManage", replace = true)
    public boolean checkAuth(BusiPerCheckDTO dto) {
        BluewingPermissionService svc = CommonBeanFactory.getBean(BluewingPermissionService.class);
        return svc == null || svc.checkAuth(dto);
    }
}
